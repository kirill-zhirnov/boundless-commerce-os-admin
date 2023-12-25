export interface INotificationMethod {
  send: () => Promise<unknown>;
}

export interface IWebhook {
  webhook_id: number
  url: string
  name: string
  secret?: string
}
