let aliases = [];

const getAliases = () => aliases;

// register an alias
// any message that matches the alias pattern
// is rewritten to defined message
// string patterns get converted to regex
// regex patterns can take regex params, e.g. `i`
// they also can take replacement patterns as described in
// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/replace#Specifying_a_string_as_a_parameter
//
// EXAMPLES
// .alias /^.bing (.+)/ = .google $1
const register = (ctx, body) => {
  const parsed = ctx.parseAssignment(body, '', 'as');

  if (parsed.error) {
    ctx.send(parsed.error);
    return;
  }

  aliases.push(parsed);
};

// removes _all_ aliases that match the body
// this should be run before most/all other handlers,
// including before `rewrite`,
// otherwise `rewrite` would rewrite the input
// and this would never match
const unregister = (ctx, body) => {
  aliases = aliases.filter(alias => !alias.pattern.test(body));
};

// rewrites the _first_ matched alias
// this should run before all other handlers,
// but after the unregister command
// see unregister docs
const rewrite = ctx => {
  for (const alias of aliases) {
    if (alias.pattern.test(ctx.message.text)) {
      ctx.message.text = ctx.message.text.replace(alias.pattern, alias.assignment);
      return;
    }
  }
};

export default {
  getAliases,
  register,
  unregister,
  rewrite
};
