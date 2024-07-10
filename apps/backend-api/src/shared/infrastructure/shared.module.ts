import {Module} from "@nestjs/common";
import {ConfigModule, ConfigService} from '@nestjs/config';
import {MysqlModule} from 'nest-mysql';
import {JwtModule} from '@nestjs/jwt';
import {DateTimeService} from '../domain/date-time.service';
import {SystemDateDateTimeService} from './date-time.service';
import {AuthenticationService} from "./authentication/authentication.service";
import {CqrsModule} from "@nestjs/cqrs";

const providers = [
    {
        provide: DateTimeService,
        useClass: SystemDateDateTimeService
    },
    AuthenticationService
];

@Module({
    imports: [
        CqrsModule,
        ConfigModule.forRoot(),
        MysqlModule.forRootAsync({
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: (configService: ConfigService) => ({
                host: configService.get('DATABASE_HOST'),
                user: configService.get('DATABASE_USER'),
                password: configService.get('DATABASE_PASSWORD'),
                database: configService.get('DATABASE_NAME'),
                port: configService.get('DATABASE_PORT'),
                waitForConnections: true,
                connectionLimit: 10,
                queueLimit: 0
            }),

        }),
        JwtModule.registerAsync({
            imports: [SharedModule],
            inject: [ConfigService],
            useFactory: async (configService: ConfigService) => ({
                secret: configService.get('JWT_SECRET'),
                signOptions: {expiresIn: '1d'}
            }),
        })
    ],
    providers: providers,
    exports: [
        ConfigModule,
        JwtModule,
        MysqlModule,
        CqrsModule,
        ...providers
    ]
})
export class SharedModule {

}
