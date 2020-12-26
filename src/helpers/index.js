module.exports.createTagSlug = function(tag) {
  return tag.replace(new RegExp('(\\s|_|-)+', 'gmi'), '-')
}