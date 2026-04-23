export function requireRole(role) {
    return (req, res, next) => {
        console.log("REQ USER ROLE:", req.user.role);
        if (!req.user) {
            return res.status(401).json({ error: "Unauthorized" });
        }

        if ((req.user.role || "").trim().toLowerCase() !== role.toLowerCase()){
            return res.status(403).json({ error: "Insufficient permissions" });
        }

        next();
    };
}