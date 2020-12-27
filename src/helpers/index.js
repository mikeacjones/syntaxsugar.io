module.exports.createTagSlug = function (tag) {
  return tag.replace(new RegExp('(\\s|_|-)+', 'gmi'), '-')
}

module.exports.powerSet = function (array) {
  var result = [];
  result.push([]);

  for (var i = 1; i < (1 << array.length); i++) {
    var subset = [];
    for (var j = 0; j < array.length; j++)
      if (i & (1 << j))
        subset.push(array[j]);

    result.push(subset);
  }

  return result;
}