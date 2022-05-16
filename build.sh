#!/bin/bash

code="$PWD"
opts=-g
cd . > /dev/null
g++ $opts $code/win -o exe
cd $code > /dev/null
