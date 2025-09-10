import { Request } from 'express';
import { ParsedQs } from 'qs';

export interface TypedRequestQuery<T extends ParsedQs> extends Request {
  query: T;
}

export interface ZerodhaCallbackQuery extends ParsedQs {
  request_token?: string;
  status?: string;
  action?: string;
}
