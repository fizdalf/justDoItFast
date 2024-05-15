import axios from 'axios';
import {uuidv7} from 'uuidv7';

describe('POST /api/game-session', () => {

    it('should return an error when playerId is not a UUID', async () => {
        try {
            await axios.post(`/api/game-session`, {
                playerId: 'not-a-uuid',
                playerIcon: 'icon',
                gameSessionId: uuidv7()
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
            await axios.post(`/api/game-session`, {playerIcon: 'icon', gameSessionId: uuidv7()});
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
            await axios.post(`/api/game-session`, {
                playerId: 'not-a-uuid',
                playerIcon: 'icon',
                gameSessionId: uuidv7()
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
            await axios.post(`/api/game-session`, {playerId: uuidv7(), gameSessionId: uuidv7()});
        } catch (error) {
            expect(error.response.status).toBe(400);
            expect(error.response.data).toEqual({
                statusCode: 400,
                message: ['playerIcon should not be empty'],
                error: 'Bad Request'
            });
        }
    });

    it('should return an error when gameSessionId is empty', async () => {
        try {
            await axios.post(`/api/game-session`, {playerId: uuidv7(), playerIcon: 'icon'});
        } catch (error) {
            expect(error.response.status).toBe(400);
            expect(error.response.data).toEqual({
                statusCode: 400,
                message: [
                    'gameSessionId must be a UUID',
                    'gameSessionId should not be empty'
                ],
                error: 'Bad Request'
            });
        }
    });

    it('should return a 201 status when all parameters are valid', async () => {
        const res = await axios.post(`/api/game-session`, {playerId: uuidv7(), playerIcon: 'icon', gameSessionId: uuidv7()});
        console.log(res);
        expect(res.status).toBe(201);
    });
});

describe('GET /api/game-session/:gameSessionId', () => {
    
});
