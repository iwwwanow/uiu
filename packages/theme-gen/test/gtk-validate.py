# Грузит GTK CSS через Gtk.CssProvider — тот же парсер, что у waybar (GTK 3).
# Печатает ошибки разбора; exit 1, если они есть.
# Usage: python3 gtk-validate.py <file.css>
import sys
import gi

gi.require_version("Gtk", "3.0")
from gi.repository import Gtk  # noqa: E402

errors = []
provider = Gtk.CssProvider()
provider.connect(
    "parsing-error",
    lambda _p, section, err: errors.append(f"{section.get_start_line() + 1}: {err.message}"),
)
try:
    provider.load_from_path(sys.argv[1])
except Exception as e:  # GTK бросает на первой фатальной ошибке
    errors.append(str(e))
for e in errors:
    print(e)
sys.exit(1 if errors else 0)
