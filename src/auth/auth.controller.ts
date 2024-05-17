import { Controller, Get, Post, Body, Response, HttpStatus, Req } from '@nestjs/common';
import { AuthService } from "./auth.service";
import { AuthData } from './data';

@Controller('/auth')
export class AuthController {
    constructor(private authService: AuthService) { }
    @Post('high_five')
    async high_five(@Body() data: any, @Response() res) {
        const message = data.events[0].message.text;
        if (message === '擊掌') {
            const response = await this.authService.high_five(data);

            //console.log(data);

            return res.status(200).json(response);
        }
        else if (message === '查詢狀態') {
            console.log("進入查詢");
            const response = await this.authService.search_high_five(data);
            return res.status(200).json(response);
        }
        else if(message === '處理請求'){
            const response = await this.authService.decide_HighFive(data);
            return res.status(200).json(response);
        }
        else {
            console.log("無效對話");
            const response = await this.authService.handleHighFiveResponse(data);
            return res.status(200).json(response);
        }

    }

}