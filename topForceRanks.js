const listItems = document.querySelectorAll('.ranking-page-table>tbody>tr');
const rankClass = "ranking-page-table__column--rank";

let initialRank = 1;

listItems.forEach(item => {

    let rank = item.querySelector(`.${rankClass}`);
    rank.innerHTML = ` #${initialRank++}`
    

});