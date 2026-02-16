declare module 'caldav' {
  export class CalDAVClient {
    constructor(options: { url: string; username: string; password: string });
    principal(): Promise<any>;
  }
}
