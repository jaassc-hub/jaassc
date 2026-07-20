// Politica de contraseña "intermedia": no exige mayusculas, simbolos ni cosas raras
// (para no volverlo tedioso para gente no tecnica), pero tampoco deja poner "12345678"
// ni "aaaaaaaa" - exige mezclar al menos una letra y un numero, y un largo minimo.
export function validarPassword(password: string): string | null {
  if (!password || password.length < 8) {
    return "La contraseña debe tener al menos 8 caracteres.";
  }
  if (password.length > 72) {
    return "La contraseña es demasiado larga.";
  }
  const tieneLetra = /[a-zA-ZáéíóúñÁÉÍÓÚÑ]/.test(password);
  const tieneNumero = /[0-9]/.test(password);
  if (!tieneLetra || !tieneNumero) {
    return "La contraseña debe combinar letras y números (ej: rio2026azul).";
  }
  const comunes = ["12345678", "password", "contraseña", "abcdefgh", "qwertyui"];
  if (comunes.includes(password.toLowerCase())) {
    return "Esa contraseña es demasiado predecible, elija otra.";
  }
  return null;
}

// Genera una contraseña temporal aleatoria que ya cumple la politica, para cuando el
// admin "resetea" la contraseña de alguien.
export function generarPasswordTemporal(): string {
  const palabras = ["rio", "agua", "sol", "valle", "monte", "luna", "flor", "cielo"];
  const palabra = palabras[Math.floor(Math.random() * palabras.length)];
  const numero = Math.floor(1000 + Math.random() * 9000);
  return `${palabra}${numero}`;
}
