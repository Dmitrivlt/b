import {NestFactory} from '@nestjs/core';
import {SwaggerModule, DocumentBuilder} from '@nestjs/swagger';
import {NestExpressApplication} from '@nestjs/platform-express';
import {join} from 'path';
import passport from 'passport';
import session from 'express-session';
import flash = require('connect-flash');
import expressHbs from 'express-handlebars';
import datef from 'datef';
import {AppModule} from './app.module';
import {Constants} from "./constants";
//import cors from "@nestjs/"

async function bootstrap() {
    const app = await NestFactory.create<NestExpressApplication>(
        AppModule
    )

    const helpers = {
        formatDate: (date) => {
            return datef('dd.MM.YYYY HH:mm:ss', date);
        },
        parseRole: (role) => {
            if (role === 'admin') {
                return 'Администратор';
            } else if (role === 'moderator') {
                return 'Модератор';
            } else {
                return 'Пользователь';
            }
        },
        checkRole: (a, b, opts) => {
            if (a == b)
                return opts.fn(this);
            else
                return opts.inverse(this);
        },
        sumChance: (a, b) => {
            return ((b / a) * 100).toFixed(2);
        }
    };

    const hbs = expressHbs.create({
        extname: '.hbs',
        defaultLayout: 'layout',
        layoutsDir: join(__dirname, '..', 'views'),
        helpers,
    });

    app.useStaticAssets(join(__dirname, '..', 'public'));
    app.setBaseViewsDir(join(__dirname, '..', 'views'));
    app.engine('hbs', hbs.engine);
    app.setViewEngine('hbs');

    app.use(
        session({
            secret: 'JvaiwTI80YZBlWBf3uZ9Czij7tjPRscMzxvzv',
            name: 'rusthot',
            resave: true,
            rolling: true,
            saveUninitialized: true,
            cookie: {
                maxAge: 24 * 60 * 60 * 1000,
                httpOnly: false,
            },
        }),
    );

    app.use(passport.initialize());
    app.use(passport.session());
    app.use(flash());

    app.enableCors({
        origin: [
            'http://localhost:8080',
            'http://127.0.0.1:8080',
            'http://localhost:8082',
            'http://192.168.0.144:8082',
            Constants.frontend_url,
            Constants.admin_url
        ],
        credentials: true,
        exposedHeaders: ['set-cookie'],
    });

    app.setGlobalPrefix('api');

    const options = new DocumentBuilder()
        .setTitle('RustHot')
        .setDescription('Описание API')
        .setVersion('1.0')
        .addBearerAuth()
        .build();
    const document = SwaggerModule.createDocument(app, options);
    SwaggerModule.setup('docs', app, document);

    await app.listen(3000);
}

bootstrap();
