import axios from 'axios';

describe('GET /api', () => {
    it('should return a message', async () => {
        const res = await axios.get(`/api`);

        expect(res.status).toBe(200);
        expect(res.data).toEqual({message: 'Hello API'});
    });

    it('should return an error when the request is invalid', async () => {
        try {
            await axios.post(`/api/room`, {});
        } catch (error) {
            expect(error.response.status).toBe(400);
            expect(error.response.data).toEqual({
                statusCode: 400,
                message: [
                    'userId should not be empty',
                    'playerIcon should not be empty',
                    'aggregateId should not be empty'
                ],
                error: 'Bad Request'
            });
        }
    });
});
