import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { AddressesModule } from './addresses/addresses.module';
import { ProductsModule } from './products/products.module';
import { FlowersModule } from './flowers/flowers.module';
import { TestimonialsModule } from './testimonials/testimonials.module';
import { GalleryModule } from './gallery/gallery.module';
import { ArticlesModule } from './articles/articles.module';
import { CommentsModule } from './comments/comments.module';
import { OrdersModule } from './orders/orders.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule,
    AuthModule,
    AddressesModule,
    ProductsModule,
    FlowersModule,
    TestimonialsModule,
    GalleryModule,
    ArticlesModule,
    CommentsModule,
    OrdersModule,
    UsersModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}