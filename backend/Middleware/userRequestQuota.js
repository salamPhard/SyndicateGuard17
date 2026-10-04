const User = require("../Models/User");

const packageDailyLimits = {
  free: 5,
  pro: 50,
  enterprise: null,
};

const getNextUtcReset = (today) => {
  const resetAt = new Date(`${today}T00:00:00.000Z`);
  resetAt.setUTCDate(resetAt.getUTCDate() + 1);
  return resetAt;
};

const userRequestQuota = async (req, res, next) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ message: "Authentication is required." });
    }

    const user = await User.findById(req.user.id).select("package isactive");
    if (!user || !user.isactive) {
      return res.status(401).json({ message: "An active user account is required." });
    }

    const packageName = user.package || "free";
    const limit = packageDailyLimits[packageName];
    if (limit === undefined) {
      return res.status(403).json({ message: "Your account has an unsupported package." });
    }

    const today = new Date().toISOString().slice(0, 10);
    const quotaFilter = { _id: user._id };
    if (limit !== null) {
      quotaFilter.$or = [
        { apiRequestCountDate: { $ne: today } },
        { apiRequestCountToday: { $lt: limit } },
      ];
    }

    const updatedUser = await User.findOneAndUpdate(
      quotaFilter,
      [
        {
          $set: {
            apiRequestCountToday: {
              $cond: [
                { $eq: ["$apiRequestCountDate", today] },
                { $ifNull: ["$apiRequestCountToday", 0] },
                0,
              ],
            },
            apiRequestCountDate: today,
          },
        },
        {
          $set: {
            apiRequestCountToday: { $add: ["$apiRequestCountToday", 1] },
          },
        },
      ],
      { returnDocument: "after", updatePipeline: true },
    );

    const resetAt = getNextUtcReset(today);
    if (!updatedUser) {
      res.set({
        "X-RateLimit-Limit": String(limit),
        "X-RateLimit-Remaining": "0",
        "X-RateLimit-Reset": String(Math.ceil(resetAt.getTime() / 1000)),
      });
      res.set("Retry-After", String(Math.ceil((resetAt.getTime() - Date.now()) / 1000)));
      return res.status(429).json({
        message: "Daily API request limit reached. Try again after midnight UTC.",
        limit,
        remaining: 0,
        resetsAt: resetAt.toISOString(),
      });
    }

    if (limit === null) {
      res.set("X-RateLimit-Limit", "unlimited");
      res.set("X-RateLimit-Remaining", "unlimited");
    } else {
      res.set({
        "X-RateLimit-Limit": String(limit),
        "X-RateLimit-Remaining": String(Math.max(0, limit - updatedUser.apiRequestCountToday)),
      });
    }
    res.set("X-RateLimit-Reset", String(Math.ceil(resetAt.getTime() / 1000)));

    req.userRequestQuota = {
      package: packageName,
      limit,
      used: updatedUser.apiRequestCountToday,
      remaining: limit === null ? null : Math.max(0, limit - updatedUser.apiRequestCountToday),
      resetsAt: resetAt.toISOString(),
    };
    return next();
  } catch (error) {
    return next(error);
  }
};

module.exports = { userRequestQuota, packageDailyLimits };
