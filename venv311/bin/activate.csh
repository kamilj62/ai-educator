# This file must be used with "source bin/activate.csh" *from csh*.
# You cannot run it directly.

# Created by Davide Di Blasi <davidedb@gmail.com>.
# Ported to Python 3.3 venv by Andrew Svetlov <andrew.svetlov@gmail.com>

alias deactivate 'test $?_OLD_VIRTUAL_PATH != 0 && setenv PATH "$_OLD_VIRTUAL_PATH" && unset _OLD_VIRTUAL_PATH; rehash; test $?_OLD_VIRTUAL_PROMPT != 0 && set prompt="$_OLD_VIRTUAL_PROMPT" && unset _OLD_VIRTUAL_PROMPT; unsetenv VIRTUAL_ENV; unsetenv VIRTUAL_ENV_PROMPT; test "\!:*" != "nondestructive" && unalias deactivate'

# Unset irrelevant variables.
deactivate nondestructive

<<<<<<< HEAD:venv311/bin/activate.csh
setenv VIRTUAL_ENV /Users/josephkamil/marvelAI/marvelAI/venv311

set _OLD_VIRTUAL_PATH="$PATH"
setenv PATH "$VIRTUAL_ENV/"bin":$PATH"
=======
setenv VIRTUAL_ENV /Users/josephkamil/marvelAI/backend/venv

set _OLD_VIRTUAL_PATH="$PATH"
setenv PATH "$VIRTUAL_ENV/"bin":$PATH"
setenv VIRTUAL_ENV_PROMPT venv
>>>>>>> 02948cc4 (Fix layout type errors, update selectors, and resolve build issues):backend/venv/bin/activate.csh


set _OLD_VIRTUAL_PROMPT="$prompt"

if (! "$?VIRTUAL_ENV_DISABLE_PROMPT") then
<<<<<<< HEAD:venv311/bin/activate.csh
    set prompt = '(venv311) '"$prompt"
    setenv VIRTUAL_ENV_PROMPT '(venv311) '
=======
    set prompt = "("venv") $prompt:q"
>>>>>>> 02948cc4 (Fix layout type errors, update selectors, and resolve build issues):backend/venv/bin/activate.csh
endif

alias pydoc python -m pydoc

rehash
