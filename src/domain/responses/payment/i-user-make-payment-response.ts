import { AmountResponse } from '../../../infrastructure/responses/payment/amount-response';
import { RecipientResponse } from '../../../infrastructure/responses/payment/recipient-response';
import { ConfirmationResponse } from '../../../infrastructure/responses/payment/confirmation-response';
import { UserMetadataResponse } from '../../../infrastructure/responses/payment/user-metadata-response';

export interface IUserMakePaymentResponse {
    id: string;
    status: string;
    amount: AmountResponse;
    recipient: RecipientResponse;
    created_at: string;
    confirmation: ConfirmationResponse;
    test: boolean;
    paid: boolean;
    refundable: boolean;
    metadata: UserMetadataResponse;
}
