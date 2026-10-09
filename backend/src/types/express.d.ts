declare global {
    namespace Express {
        interface Request {
            user?: {
                id: string;
                role: "ADMIN" | "RESPONDER" | "VIEWER";
            };
        }
    }
}

export {};