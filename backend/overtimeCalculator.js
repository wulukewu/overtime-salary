function calculateOvertimePay(salary, endHour, minutes) {
  const hourlyRate = salary / 30 / 8;
  const hour = endHour - 19;
  const min = minutes / 60;

  let pay = 0;

  if (hour === 0) {
    pay = hourlyRate * min * 1.34;
  } else if (hour === 1) {
    pay = hourlyRate * (hour + min) * 1.34;
  } else if (hour === 2) {
    if (minutes === 0) {
      pay = hourlyRate * hour * 1.34;
    } else {
      pay = hourlyRate * (2 * 1.34 + (endHour - 21 + min) * 1.67);
    }
  } else if (hour > 2) {
    pay = hourlyRate * (hour - 2 + min) * 1.67 + hourlyRate * 2 * 1.34;
  }

  return Math.round(pay);
}

module.exports = calculateOvertimePay;
