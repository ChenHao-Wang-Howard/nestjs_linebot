import { Injectable } from "@nestjs/common";
import * as line from '@line/bot-sdk';
import { from, Observable } from 'rxjs';
import { PrismaService } from "src/prisma/prisma.service";
@Injectable({})
export class AuthService {
    constructor(private prisma: PrismaService) { }
    clientConfig: line.ClientConfig = {
        channelAccessToken: 'Line_access_token',
        channelSecret: 'Line_access_secret',
    };
    private sessionStore = new Map();

    async high_five(message_content: any) {
        try {
            const client = new line.messagingApi.MessagingApiClient(this.clientConfig);
            //console.log(message_content.events[0].message.text);
            // 查詢是否存在指定 userId 的使用者
            const User_info = (await client.getProfile(message_content.events[0].source.userId)).userId;
            const existingUser = await this.prisma.user.findUnique({
                where: { Line_Id: User_info }
            });
            if (!existingUser) {
                // 如果使用者不存在，創建新使用者
                console.log('第一次使用，創建使用者')
                const newUser = await this.prisma.user.create({
                    data: {
                        Line_Id: User_info,
                        username: (await client.getProfile(message_content.events[0].source.userId)).displayName // 如果有提供使用者名稱的話
                    }
                });
            }
            //詢問向誰擊掌且保存對話狀態在session
            this.sessionStore.set(User_info, { step: 1, userId: User_info });
            return from(client.replyMessage({
                replyToken: message_content.events[0].replyToken,
                messages: [{
                    type: 'text',
                    text: "請問你想要與誰擊掌 ?",
                }]
            })
                .catch((err) => {
                    if (err instanceof line.HTTPFetchError) {
                        console.error(err.status);
                        console.error(err.headers.get('x-line-request-id'));
                        console.error(err.body);
                    }
                }));
        } catch (error) {
            console.error('Error:', error);

        }

    }
    async handleHighFiveResponse(message_content: any) {
        //向對方發起擊掌請求
        const client = new line.messagingApi.MessagingApiClient(this.clientConfig);
        const lineId = (await client.getProfile(message_content.events[0].source.userId)).userId
        const respondeText = message_content.events[0].message.text
        const session = this.sessionStore.get(lineId);
        //退出擊掌請求session
        if (respondeText == '回到主頁') {
            this.sessionStore.delete(lineId);
            console.log('kill session')
        }
        //進入提出擊掌請求session
        else if (session && session.step === 1) {

            const requesterId = await this.prisma.user.findUnique({
                where: { Line_Id: session.userId }
            });
            console.log(typeof respondeText)
            const responder = await this.prisma.user.findUnique({ where: { username: respondeText } });
            if (responder) {
                await this.prisma.highFive.create({
                    data: {
                        requester_id: requesterId.user_id,
                        responder_id: responder.user_id,
                        status: '未擊掌',
                    },
                });

                this.sessionStore.delete(lineId);

                return client.replyMessage({
                    replyToken: message_content.events[0].replyToken,
                    messages: [{
                        type: 'text',
                        text: "已向對方發送擊掌請求",
                    }]
                })

            } else {
                return client.replyMessage({
                    replyToken: message_content.events[0].replyToken,
                    messages: [{
                        type: 'text',
                        text: "未找到指定用戶，請重新輸入名字，跳出此功能請輸入回到主頁",
                    }]
                });
            }
        }
        //進入是否同意擊掌請求session
        else if (session && session.step === 2) {
            const username = (await client.getProfile(message_content.events[0].source.userId)).displayName;
            const user = await this.prisma.user.findUnique({ where: { username: username } });
            const highFiveRequest = await this.prisma.highFive.findFirst({
                where: { responder_id: user.user_id, status: '未擊掌' },
            });
            this.sessionStore.delete(lineId);
            console.log('deal add friend or not')
            if (respondeText === '是') {
                await this.updateHighFiveStatus(highFiveRequest.highfive_id, '已擊掌');
                return client.replyMessage({
                    replyToken: message_content.events[0].replyToken,
                    messages: [{
                        type: 'text',
                        text: "已完成擊掌",
                    }]
                });
            } else if (respondeText === '否') {
                await this.updateHighFiveStatus(highFiveRequest.highfive_id, '已拒絕');
                return client.replyMessage({
                    replyToken: message_content.events[0].replyToken,
                    messages: [{
                        type: 'text',
                        text: "已拒絕擊掌",
                    }]
                });
            } else {
                return client.replyMessage({
                    replyToken: message_content.events[0].replyToken,
                    messages: [{
                        type: 'text',
                        text: "請回答是或否",
                    }]
                });
            }

        }
        else {
            return client.replyMessage({
                replyToken: message_content.events[0].replyToken,
                messages: [{
                    type: 'text',
                    text: "未找到有效的會話，請重新開始",
                }]
            });
        }
    }


    async search_high_five(message_content: any) {

        const client = new line.messagingApi.MessagingApiClient(this.clientConfig);
        const username = (await client.getProfile(message_content.events[0].source.userId)).displayName
        const user = await this.prisma.user.findUnique({ where: { username: username } });

        if (!user) {
            return client.replyMessage({
                replyToken: message_content.events[0].replyToken,
                messages: [{
                    type: 'text',
                    text: "未找到使用者",
                }]
            });
        }
        //提出請求擊掌名單
        const sentHighFives = await this.prisma.highFive.findMany({
            where: { requester_id: user.user_id },
            include: {
                responder: {
                    select: {
                        username: true,
                    },
                },
            },
        });
        //收到請求擊掌名單
        const receivedHighFives = await this.prisma.highFive.findMany({
            where: { responder_id: user.user_id },
            include: {
                requester: {
                    select: {
                        username: true,
                    },
                },
            },
        });
        const responderNames = sentHighFives.map(highFive => highFive.responder.username);
        const responderNamesString = responderNames.join(', ');
        const requesterNames = receivedHighFives.map(highFive => highFive.requester.username);
        const requesterNamesString = requesterNames.join(', ');
        const highFiveRequests = await this.prisma.highFive.findMany({
            where: { responder_id: user.user_id, status: '已擊掌' },
            include: { requester: true },
        });

        if (highFiveRequests.length === 0) {
            return client.replyMessage({
                replyToken: message_content.events[0].replyToken,
                messages: [{
                    type: 'text',
                    text: "沒有待處理的擊掌請求",
                }]
            });
        }

        const List_highfive_request = highFiveRequests.map(request => (request.requester.username));
        const List_highfive_request_String = List_highfive_request.join(', ');

        return client.replyMessage({
            replyToken: message_content.events[0].replyToken,
            messages: [{
                type: 'text',
                text: '送出的請求\n' + responderNamesString,
            },
            {
                type: 'text',
                text: "收到的請求\n" + requesterNamesString,
            },
            {
                type: 'text',
                text: "已經互相擊掌\n" + List_highfive_request_String,
            }
            ]
        });
    }
    //更新擊掌狀態
    async updateHighFiveStatus(highFiveId: number, status: string) {
        const highFive = await this.prisma.highFive.update({
            where: { highfive_id: highFiveId },
            data: { status: status },
        });

        return highFive;
    }
    //決定是否同意擊掌請求
    //進入session 2對話情況
    async decide_HighFive(message_content: any) {
        try {
            const client = new line.messagingApi.MessagingApiClient(this.clientConfig);
            const username = (await client.getProfile(message_content.events[0].source.userId)).displayName;
            const user = await this.prisma.user.findUnique({ where: { username: username } });
            const User_info = (await client.getProfile(message_content.events[0].source.userId)).userId;
            const response = message_content.events[0].message.text;
            if (!user) {
                return client.replyMessage({
                    replyToken: message_content.events[0].replyToken,
                    messages: [{
                        type: 'text',
                        text: "沒有待處理的擊掌請求",
                    }]
                });
            }
            const highFiveRequest = await this.prisma.highFive.findFirst({ where: { responder_id: user.user_id, status: '未擊掌' } });

            if (!highFiveRequest) {
                return client.replyMessage({
                    replyToken: message_content.events[0].replyToken,
                    messages: [{
                        type: 'text',
                        text: "沒有待處理的擊掌請求",
                    }]
                });
            } else {
                const requester_name = (await this.prisma.user.findUnique({ where: { user_id: highFiveRequest.requester_id } })).username;
                this.sessionStore.set(User_info, { step: 2, userId: User_info });
                return client.replyMessage({
                    replyToken: message_content.events[0].replyToken,
                    messages: [{
                        type: 'text',
                        text: "是否接受 " + requester_name + "的請求?",
                    }]
                })
            }
        } catch (error) {
            console.error('Error:', error);

        }



    }



}
