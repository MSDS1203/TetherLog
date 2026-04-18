import jwt from "jsonwebtoken";

export function generateToken(user) {
    return jwt.sign(
        {
            id: user.id,
            role: user.role,
            email: user.email,
            name: user.name
        },
        process.env.JWT_SECRET,
        { expiresIn: "7d" }
    );
}

export function verifyToken(token) {
    return jwt.verify(token, process.env.JWT_SECRET);
}