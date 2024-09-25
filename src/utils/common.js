export const getRoomId = (userId1, userId2)=>{
    const sortedIds = [userId1, userId2].sort();
    const roomId = sortedIds.join('-');
    return roomId; 
}

export const formatDate = date =>{
    var day = date.getDate();
    var monthNames = ["jan", "fev", "mar", "abr", "maio", "jun", "jul", "ago", "set", "out", "nov", "dez"]
    var month = monthNames[date.getMonth()];

    var formattedDate = day+" "+month;
    return formattedDate;
}