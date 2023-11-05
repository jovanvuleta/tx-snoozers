import os

from telegram import Bot
from telegram.error import BadRequest

bot_token = os.environ.get("BOT_TOKEN")
chat_id = os.environ.get("CHAT_ID")
bot = Bot(token=bot_token)


async def send_tg_message(message_text: str):
    try:
        await bot.send_message(chat_id=chat_id, text=message_text)
        print('Message sent to the channel.')
    except BadRequest as e:
        print(f'Error sending message: {e}')
