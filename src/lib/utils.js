const lerp = (start, end, time) => start * (1 - time) + end * time;

module.exports = lerp;
