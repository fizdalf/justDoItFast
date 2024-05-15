export abstract class IdentityService {

  public abstract getIdentity(): Promise<string>

  public abstract setIdentity(identity: string): Promise<void>

  public abstract clearIdentity(): Promise<void>

}
