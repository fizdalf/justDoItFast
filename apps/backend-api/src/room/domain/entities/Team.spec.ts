import {TeamId} from "../valueObjects/TeamId";
import {Team} from "./Team";
import {UserId} from "../valueObjects/UserId";
import {UserName} from "../valueObjects/UserName";
import {User} from "./User";
import {UserLastContactedAt} from "../valueObjects/userLastContactedAt";


describe('Team', () => {
    it('should be defined', () => {
        expect(true).toBeDefined();
    });

    it('should report the zero members when it is initialized with no members', () => {
        const team = new Team({id: TeamId.random(), members: []});

        expect(team.memberCount).toBe(0);
    });

    it('should report the correct number of members when it is initialized with members', () => {
        const team = new Team({
            id: TeamId.random(),
            members: [new User({
                id: UserId.random(),
                name: UserName.fromValue('John Doe'),
                lastContactedAt: new UserLastContactedAt(new Date())
            })]
        });

        expect(team.memberCount).toBe(1);
    });

    it('should report the correct number of members when members are added', () => {
        const team = new Team({id: TeamId.random(), members: []});

        team.addMember(new User({
            id: UserId.random(),
            name: UserName.fromValue('John Doe'),
            lastContactedAt: new UserLastContactedAt(new Date())
        }));

        expect(team.memberCount).toBe(1);
    });

    it('should report the correct number of members when members are removed', () => {
        const user = new User({
            id: UserId.random(),
            name: UserName.fromValue('John Doe'),
            lastContactedAt: new UserLastContactedAt(new Date())
        });
        const team = new Team({id: TeamId.random(), members: [user]});

        team.removeMember(user.id);

        expect(team.memberCount).toBe(0);
    });

    it('should report the correct number of members when extra members are removed', () => {
        const user1 = new User({
            id: UserId.random(),
            name: UserName.fromValue('John Doe'),
            lastContactedAt: new UserLastContactedAt(new Date())
        });
        const user2 = new User({
            id: UserId.random(),
            name: UserName.fromValue('Jane Doe'),
            lastContactedAt: new UserLastContactedAt(new Date())
        });
        const team = new Team({id: TeamId.random(), members: [user1, user2]});

        team.removeExtraMembers(1);

        expect(team.memberCount).toBe(1);
    });

    it('should report member not belonging to team when member does not belong to team', () => {
        const id = UserId.random();
        const user = new User({
            id: id,
            name: UserName.fromValue('John Doe'),
            lastContactedAt: new UserLastContactedAt(new Date())
        });
        const team = new Team({id: TeamId.random(), members: [user]});

        const otherUserId = UserId.random();

        expect(team.isMember(otherUserId)).toBe(false);
    });

    it('should report member belonging to team when member belongs to team', () => {
        const id = UserId.random();
        const user = new User({
            id: id,
            name: UserName.fromValue('John Doe'),
            lastContactedAt: new UserLastContactedAt(new Date())
        });
        const user2 = new User({
            id: UserId.random(),
            name: UserName.fromValue('Jane Doe'),
            lastContactedAt: new UserLastContactedAt(new Date())
        });
        const team = new Team({id: TeamId.random(), members: [user, user2]});

        expect(team.isMember(id)).toBe(true);
    });

    it('should return the member when it exists', () => {
        const user2 = new User({
            id: UserId.random(),
            name: UserName.fromValue('Jane Doe'),
            lastContactedAt: new UserLastContactedAt(new Date())
        });
        const id = UserId.random();
        const user = new User({
            id: id,
            name: UserName.fromValue('John Doe'),
            lastContactedAt: new UserLastContactedAt(new Date())
        });
        const team = new Team({id: TeamId.random(), members: [user, user2]});

        expect(team.getMember(id)).toBe(user);
    });


});
