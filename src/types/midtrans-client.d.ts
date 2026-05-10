declare module "midtrans-client" {
  export interface SnapTransactionDetails {
    order_id: string;
    gross_amount: number;
  }

  export interface SnapCustomerDetails {
    first_name: string;
    last_name?: string;
    email: string;
    phone?: string;
  }

  export interface SnapParameter {
    transaction_details: SnapTransactionDetails;
    customer_details: SnapCustomerDetails;
  }

  export interface SnapTransactionResponse {
    token: string;
    redirect_url: string;
  }

  export class Snap {
    constructor(config: {
      isProduction: boolean;
      serverKey: string;
      clientKey: string;
    });
    createTransaction(parameter: SnapParameter): Promise<SnapTransactionResponse>;
  }

  const midtransClient: {
    Snap: typeof Snap;
  };

  export default midtransClient;
}
