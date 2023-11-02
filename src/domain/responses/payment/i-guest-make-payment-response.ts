import { AmountResponse } from '../../../infrastructure/responses/payment/amount-response';
import { RecipientResponse } from '../../../infrastructure/responses/payment/recipient-response';
import { ConfirmationResponse } from '../../../infrastructure/responses/payment/confirmation-response';
import { GuestMetadataResponse } from '../../../infrastructure/responses/payment/guest-metadata-response';

export interface IGuestMakePaymentResponse {
    id: string;
    status: string;
    amount: AmountResponse;
    recipient: RecipientResponse;
    created_at: string;
    confirmation: ConfirmationResponse;
    test: boolean;
    paid: boolean;
    refundable: boolean;
    metadata: GuestMetadataResponse;
}
