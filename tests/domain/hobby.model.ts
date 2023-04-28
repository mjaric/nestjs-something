import { Field } from "../../src";

export class Hobby {
  @Field({ primary: true })
  public id!: string;
  @Field()
  public name = "";
  @Field()
  public since: Date = new Date();
}
