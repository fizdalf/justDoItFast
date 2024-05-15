import {Module} from "@nestjs/common";
import {ConfigModule, ConfigService} from '@nestjs/config';
import {MysqlModule} from 'nest-mysql';
import {JwtModule} from '@nestjs/jwt';

@Module({
    imports: [
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
    providers: [],
    exports: [
        ConfigModule,
        JwtModule,
        MysqlModule,
    ]
})
export class SharedModule {

}
