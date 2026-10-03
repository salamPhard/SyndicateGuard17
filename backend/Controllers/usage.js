const RateLimit = require('../Models/RateLimit');
const { getUsageSnapshot } = require('../Middleware/rateLimiter');

const normalizeUsageEntry = (entry) => ({
  packageName: entry.packageName,
  clientId: entry.clientId,
  count: entry.count,
  resetAt: entry.resetAt,
  key: entry.key,
});

exports.getUsageSummary = async (_req, res) => {
  try {
    const configuredPackages = await RateLimit.find({}).lean();
    const snapshot = getUsageSnapshot();

    const usageByPackage = snapshot.reduce((accumulator, entry) => {
      const packageEntry = accumulator[entry.packageName] || {
        package: entry.packageName,
        requests: 0,
        clients: 0,
        activeClients: [],
      };

      packageEntry.requests += entry.count;
      packageEntry.clients += 1;
      packageEntry.activeClients.push({
        clientId: entry.clientId,
        count: entry.count,
        resetAt: entry.resetAt,
      });

      accumulator[entry.packageName] = packageEntry;
      return accumulator;
    }, {});

    const packages = configuredPackages.map((rateLimit) => {
      const details = usageByPackage[rateLimit.package] || {
        package: rateLimit.package,
        requests: 0,
        clients: 0,
        activeClients: [],
      };

      return {
        package: rateLimit.package,
        limit: rateLimit.limit,
        window: rateLimit.window,
        requests: details.requests,
        clients: details.clients,
        activeClients: details.activeClients,
      };
    });

    return res.status(200).json({
      packages,
      activeUsage: snapshot.map(normalizeUsageEntry),
      totalActiveClients: snapshot.length,
    });
  } catch (error) {
    return res.status(500).json({
      message: 'Unable to load rate-limit usage.',
      error: error.message,
    });
  }
};

exports.clearUsageSummary = async (_req, res) => {
  try {
    const { requestCounts } = require('../Middleware/rateLimiter');
    requestCounts.clear();

    return res.status(200).json({ message: 'Rate-limit usage cache cleared.' });
  } catch (error) {
    return res.status(500).json({
      message: 'Unable to clear rate-limit usage.',
      error: error.message,
    });
  }
};
