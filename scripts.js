function createRoom()
{
	var name = prompt("Wpisz nazwę pokoju")
	if (name != null && name != '')
		window.location.assign('/createRoom?name=' + name)
}

function changeUsername()
{
	var newUsername = prompt("Podaj nową nazwę użytkownika")
	if (newUsername != null && newUsername != '')
		window.location.assign('/changeUsername?returnUrl=' + window.location.href + '&newUsername=' + newUsername)
}
