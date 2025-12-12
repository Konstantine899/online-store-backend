import { PaginatedResponse } from './paginated.response';
import type { MetaData } from '@app/infrastructure/paginate';

describe('PaginatedResponse', () => {
    it('должен создавать объект с правильной структурой', () => {
        const mockData = [{ id: 1, name: 'Test' }];
        const mockMeta: MetaData = {
            totalCount: 1,
            lastPage: 1,
            currentPage: 1,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            nextPage: null as any,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            previousPage: null as any,
            limit: 5,
        };

        const response = new PaginatedResponse(mockData, mockMeta);

        expect(response.data).toEqual(mockData);
        expect(response.meta).toEqual(mockMeta);
    });
});
