// backend/utils/validadorCedula.js

function validarCedula(cedula) {
  // 1. Validar longitud
  if (cedula.length !== 10) return false;

  // 2. Validar que sean solo números
  const digits = cedula.split('').map(Number);
  if (digits.some(isNaN)) return false;

  // 3. Validar código de provincia (01-24)
  const provincia = parseInt(cedula.substring(0, 2));
  if (provincia < 1 || provincia > 24) return false;

  // 4. Validar tercer dígito (debe ser menor a 6 para personas naturales)
  if (digits[2] >= 6) return false;

  // 5. Algoritmo Módulo 10
  const coeficientes = [2, 1, 2, 1, 2, 1, 2, 1, 2];
  const verificador = digits[9];
  let suma = 0;

  for (let i = 0; i < 9; i++) {
    let valor = digits[i] * coeficientes[i];
    if (valor >= 10) {
      valor = valor - 9;
    }
    suma += valor;
  }

  const total = Math.ceil(suma / 10) * 10;
  const digitoCalculado = total - suma;

  return digitoCalculado === verificador;
}

module.exports = validarCedula;