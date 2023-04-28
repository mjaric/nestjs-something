// @DomainEvent(User, 'user.created')
export class UserCreated {
  constructor(
    public readonly id: string,
    public readonly firstName: string,
    public readonly lastName: string,
    public readonly age: number,
    public readonly acceptedTerms: boolean,
    public readonly role: string,
    public readonly address: {
      addressLine: string;
      postalCode: string;
      city: string;
    },
  ) {}
}

export class UserAddressChanged {
  constructor(
    public readonly user_id: string,
    public readonly addressLine: string,
    public readonly postalCode: string,
    public readonly city: string,
  ) {}
}
