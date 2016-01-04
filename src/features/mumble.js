const echo = ctx => {
  console.log(`mumble echo: ${ctx.message.text}`);
};

export default {
  echo
};
