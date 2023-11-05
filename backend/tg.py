import os

from telegram import Bot
from telegram.error import BadRequest

bot = Bot(token=os.environ.get("BOT_TOKEN"))


async def send_tg_message(message_text: str):
    try:
        await bot.send_message(chat_id=os.environ.get("CHAT_ID"), text=message_text)
        print('Message sent to the channel.')
    except BadRequest as e:
        print(f'Error sending message: {e}')
