import { JwtPayload } from "jsonwebtoken";

declare global {
  namespace Express {
    interface Request {
      user?: DecodedToken;
    }
  }
}

export interface DecodedToken extends JwtPayload {
  roles?: string | string[];
  [key: string]: any;
}
