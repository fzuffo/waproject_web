export default interface IOrder {
  id?: number;
  userId?: number;
  description: string;
  amount: string;
  value: string;

  createdDate?: Date;
  updatedDate?: Date;
}
