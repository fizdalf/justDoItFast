// import required dependencies

import {User} from "./User";
import {Team} from "./Team";
import {Teams} from "./Teams";
import {UserId} from "../valueObjects/UserId";
import {UserName} from "../valueObjects/UserName";
import {UserLastContactedAt} from "../valueObjects/userLastContactedAt";
import {TeamId} from "../valueObjects/TeamId";
import {Seats} from "./Seats";
import {Seat} from "./Seat";


describe('Teams class', () => {
    let user1: User;
    let user2: User;
    let user3: User;
    let user4: User;
    let team1: Team;
    let team2: Team;
    let teams: Teams;

    beforeEach(() => {
        user1 = new User({
            id: UserId.random(),
            name: UserName.fromValue('Manuel Doe'),
            lastContactedAt: UserLastContactedAt.create(new Date())
        });
        user2 = new User({
            id: UserId.random(),
            name: UserName.fromValue('Diana Doe'),
            lastContactedAt: UserLastContactedAt.create(new Date())
        });
        user3 = new User({
            id: UserId.random(),
            name: UserName.fromValue('John Doe'),
            lastContactedAt: UserLastContactedAt.create(new Date())
        });
        user4 = new User({
            id: UserId.random(),
            name: UserName.fromValue('Jane Doe'),
            lastContactedAt: UserLastContactedAt.create(new Date())
        });
        team1 = new Team({id: TeamId.random(), members: [user1, user2]});
        team2 = new Team({id: TeamId.random(), members: [user3, user4]});
        teams = new Teams(team1, team2);
    });

    it('should be able to add a member to a team', () => {
        const newUser = new User({
            id: UserId.random(),
            name: UserName.random(),
            lastContactedAt: UserLastContactedAt.create(new Date())
        });
        teams.addMember(newUser);
        expect(teams.toArray().map(t => t.memberCount)).toEqual(expect.arrayContaining([2, 2]));
    });

    it('should be able to remove a player by id', () => {
        teams.removePlayer(user1.id);
        expect(team1.isMember(user1.id)).toBe(false);
    });

    it('should make all teams have the same amount of players when removing players', () => {
        teams.removeIdleMembersFromTeams([user3.id]);

        expect(teams.toArray().map(t => t.memberCount)).toEqual(expect.arrayContaining([1, 1]));
    });

    it('should throw error if player does not belong to any team when creating seats', () => {
        const faultyPlayer = UserId.random();
        expect(() => teams.createSeats([faultyPlayer, user1.id, user2.id, user3.id])).toThrow('Player does not belong to any team');
    });

    it('should throw error if players do not alternate teams when creating seats', () => {

        expect(() => teams.createSeats([user1.id, user2.id, user3.id, user4.id])).toThrow('Players do not alternate teams');
    });

    it('should create seats using the order given', () => {

        const expectedSeats = new Seats(
            new Seat(0, user4, team2),
            new Seat(1, user1, team1),
            new Seat(2, user3, team2),
            new Seat(3, user2, team1),
        )

        const seats = teams.createSeats([user4.id, user1.id, user3.id, user2.id]);
        expect(seats).toEqual(expectedSeats);
    });

    it('should throw error if teams are not balanced when creating seats', () => {
        const teams = new Teams(
            new Team({id: TeamId.random(), members: [user1]}),
            new Team({id: TeamId.random(), members: [user2, user3]})
        );
        expect(() => teams.createSeats([user1.id, user2.id, user3.id])).toThrow('Teams are not balanced');
    });

    it('should throw error if number of players does not match the total number of players in the teams when creating seats', () => {
        expect(() => teams.createSeats([user1.id, user2.id])).toThrow('Number of players does not match the total number of players in the teams');
    });

    it('should throw if the player is already in the game when creating seats', () => {
        expect(() => teams.createSeats([user1.id, user3.id, user1.id, user4.id])).toThrow('Player already in game');
    });

});
