import { Field } from "../../src/schema";

export class Hobby {
  @Field({ primary: true })
  public id!: string;
  @Field()
  public name = "";
  @Field()
  public since: Date = new Date();
}
