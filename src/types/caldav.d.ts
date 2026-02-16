declare module 'caldav' {
  export class CalDAVClient {
    constructor(options: { url: string; username: string; password: string });
  }
  
  export class Principal {
    calendars(): Promise<Calendar[]>;
  }
  
  export class Calendar {
    name: string;
    events(): Promise<CalDAVEvent[]>;
  }
  
  export class CalDAVEvent {
    data: any;
    vobject?: {
      vevent?: {
        summary?: { value: string };
      };
    };
  }
}
