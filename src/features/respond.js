let responses = [];

const getResponses = () => responses;

const register = (ctx, body) => {
  const parsed = ctx.parseAssignment(body, 'to', 'with');

  if (parsed.error) {
    ctx.send(parsed.error);
    return;
  }

  responses.push(parsed);
};

const unregister = (ctx, body) => {
  responses = responses.filter(response => !response.pattern.test(body));
};

const respond = ctx => {
  for (let {pattern, assignment} of responses) {
    const matches = pattern.exec(ctx.message.text);

    if (matches) {
      if (matches.length > 1) {
        for (let i = 1; i < matches.length; i++) {
          assignment = assignment.replace(new RegExp(`\\$${i}`), matches[i]);
        }
      }

      ctx.send(assignment);
    }
  }
};

export default {
  getResponses,
  register,
  unregister,
  respond
};
