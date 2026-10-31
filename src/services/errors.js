// Lives in its own file so any service can throw it without importing another service.
// memberService re-exports it, so every existing import keeps working.
export class ServiceError extends Error {
  constructor(message, field) {
    super(message);
    this.name = "ServiceError";
    this.field = field;
  }
}