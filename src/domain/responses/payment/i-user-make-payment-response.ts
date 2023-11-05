import {
    AmountResponse,
    RecipientResponse,
    ConfirmationResponse,
    UserMetadataResponse,
} from '@app/infrastructure/responses';

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
