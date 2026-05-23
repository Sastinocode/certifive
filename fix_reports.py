"""
fix_reports.py — ejecutar desde PowerShell:
  cd D:\Users\Helpia\Documents\Claude\Projects\CERTIFIVE\certifive
  python fix_reports.py

Repara el JSX corrupto en reports.tsx (clientPhone+Textarea fusionados)
y hace el commit+push automáticamente.
"""
import os, sys, subprocess

FILE = os.path.join(os.path.dirname(__file__), "client", "src", "pages", "reports.tsx")

BROKEN = '''        <div>
          <Label htmlFor="clientPhone">Teléfono</Label>
          <Input
            id="clientPhone"
            value={formData.clientPhone}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          placeholder="Notas adicionales"
          rows={3}
        />
      </div>

      <div className="flex justify-end gap-2 pt-4">'''

FIXED = '''        <div>
          <Label htmlFor="clientPhone">Teléfono</Label>
          <Input
            id="clientPhone"
            value={formData.clientPhone}
            onChange={(e) => setFormData({ ...formData, clientPhone: e.target.value })}
            placeholder="Teléfono del cliente"
          />
        </div>
      </div>

      <div>
        <Label htmlFor="notes">Notas</Label>
        <Textarea
          id="notes"
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          placeholder="Notas adicionales"
          rows={3}
        />
      </div>

      <div className="flex justify-end gap-2 pt-4">'''

print(f"Leyendo {FILE}...")
with open(FILE, "r", encoding="utf-8") as f:
    content = f.read()

if BROKEN not in content:
    print("AVISO: el bloque roto no se encontró — puede que ya esté arreglado.")
    print(f"Líneas actuales: {content.count(chr(10))}")
    sys.exit(0)

content = content.replace(BROKEN, FIXED, 1)
with open(FILE, "w", encoding="utf-8", newline="\n") as f:
    f.write(content)

lines = content.count("\n")
print(f"✓ reports.tsx reparado — {lines} líneas")

# Git commit + push
repo = os.path.dirname(__file__)
cmds = [
    ["git", "add", "client/src/pages/reports.tsx"],
    ["git", "commit", "-m", "fix: Repair corrupted JSX in reports.tsx (clientPhone/Textarea merge)"],
    ["git", "push", "origin", "main"],
]
for cmd in cmds:
    print(f"\n$ {' '.join(cmd)}")
    result = subprocess.run(cmd, cwd=repo, capture_output=False)
    if result.returncode != 0:
        print(f"ERROR: comando falló con código {result.returncode}")
        sys.exit(result.returncode)

print("\n✓ Push completado — Railway debería iniciar un nuevo build")
