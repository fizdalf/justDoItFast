import axios from 'axios';
import {uuidv7} from 'uuidv7';

describe('POST /api/room', () => {

    it('should return an error when playerId is not a UUID', async () => {
        try {
            await axios.post(`/api/room`, {
                playerId: 'not-a-uuid',
                playerIcon: 'icon',
                roomId: uuidv7()
            });
        } catch (error) {
            expect(error.response.status).toBe(400);
            expect(error.response.data).toEqual({
                statusCode: 400,
                message: ['playerId must be a UUID'],
                error: 'Bad Request'
            });
        }
    });

    it('should return an error when playerId is empty', async () => {
        try {
            await axios.post(`/api/room`, {playerIcon: 'icon', roomId: uuidv7()});
        } catch (error) {
            expect(error.response.status).toBe(400);
            expect(error.response.data).toEqual({
                statusCode: 400,
                message: [
                    'playerId must be a UUID',
                    'playerId should not be empty'
                ],
                error: 'Bad Request'
            });
        }
    });

    it('should return an error when playerId is not a UUID', async () => {
        try {
            await axios.post(`/api/room`, {
                playerId: 'not-a-uuid',
                playerIcon: 'icon',
                roomId: uuidv7()
            });
        } catch (error) {
            expect(error.response.status).toBe(400);
            expect(error.response.data).toEqual({
                statusCode: 400,
                message: ['playerId must be a UUID'],
                error: 'Bad Request'
            });
        }
    });

    it('should return an error when playerIcon is empty', async () => {
        try {
            await axios.post(`/api/room`, {playerId: uuidv7(), roomId: uuidv7()});
        } catch (error) {
            expect(error.response.status).toBe(400);
            expect(error.response.data).toEqual({
                statusCode: 400,
                message: ['playerIcon should not be empty'],
                error: 'Bad Request'
            });
        }
    });

    it('should return an error when roomId is empty', async () => {
        try {
            await axios.post(`/api/room`, {playerId: uuidv7(), playerIcon: 'icon'});
        } catch (error) {
            expect(error.response.status).toBe(400);
            expect(error.response.data).toEqual({
                statusCode: 400,
                message: [
                    'roomId must be a UUID',
                    'roomId should not be empty'
                ],
                error: 'Bad Request'
            });
        }
    });

    it('should return a 201 status when all parameters are valid', async () => {
        const res = await axios.post(`/api/room`, {playerId: uuidv7(), playerIcon: 'icon', roomId: uuidv7()});
        console.log(res);
        expect(res.status).toBe(201);
    });
});

describe('GET /api/room/:roomId', () => {
    
});
