import type {
    AmountResponse,
    RecipientResponse,
    ConfirmationResponse,
    GuestMetadataResponse,
} from '@app/infrastructure/responses';

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
