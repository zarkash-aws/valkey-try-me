// Copyright (c) 2012, The v86 contributors
// All rights reserved.

// ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
// WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
// DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT OWNER OR CONTRIBUTORS BE LIABLE FOR
// ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
// (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
// LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
// ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
// (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
// SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.

"use strict";

/**
 * @constructor
 *
 * @param {BusConnector} bus
 */
function SerialAdapter(element, bus)
{
    var serial = this;

    this.enabled = true;
    this.bus = bus;
    this.text = "";
    this.text_new_line = false;

    this.last_update = 0;


    this.bus.register("serial0-output-byte", function(byte)
    {
        var chr = String.fromCharCode(byte);
        this.show_char(chr);
    }, this);


    this.destroy = function()
    {
        element.removeEventListener("keypress", keypress_handler, false);
        element.removeEventListener("keydown", keydown_handler, false);
        element.removeEventListener("paste", paste_handler, false);
        window.removeEventListener("mousedown", window_click_handler, false);
    };

    this.init = function()
    {
        this.destroy();

        element.style.display = "block";
        element.addEventListener("keypress", keypress_handler, false);
        element.addEventListener("keydown", keydown_handler, false);
        element.addEventListener("paste", paste_handler, false);
        window.addEventListener("mousedown", window_click_handler, false);
    };
    this.init();


    this.show_char = function(chr)
    {
        if(chr === "\x08")
        {
            this.text = this.text.slice(0, -1);
            this.update();
        }
        else if(chr === "\r")
        {
            // do nothing
        }
        else
        {
            this.text += chr;

            if(chr === "\n")
            {
                this.text_new_line = true;
            }

            this.update();
        }
    };

    this.update = function()
    {
        var now = Date.now();
        var delta = now - this.last_update;

        if(delta < 16)
        {
            if(this.update_timer === undefined)
            {
                this.update_timer = setTimeout(() => {
                    this.update_timer = undefined;
                    var now = Date.now();
                    dbg_assert(now - this.last_update >= 15);
                    this.last_update = now;
                    this.render();
                }, 16 - delta);
            }
        }
        else
        {
            if(this.update_timer !== undefined)
            {
                clearTimeout(this.update_timer);
                this.update_timer = undefined;
            }

            this.last_update = now;
            this.render();
        }
    };

    this.render = function()
    {
        element.value = this.text;

        if(this.text_new_line)
        {
            this.text_new_line = false;
            element.scrollTop = 1e9;
        }
    };

    /**
     * @param {number} chr_code
     */
    this.send_char = function(chr_code)
    {
        if(serial.bus)
        {
            serial.bus.send("serial0-input", chr_code);
        }
    };

    function may_handle(e)
    {
        if(!serial.enabled)
        {
            return false;
        }

        // Something here?

        return true;
    }

    function keypress_handler(e)
    {
        if(!serial.bus)
        {
            return;
        }
        if(!may_handle(e))
        {
            return;
        }

        var chr = e.which;

        serial.send_char(chr);
        e.preventDefault();
    }

    function keydown_handler(e)
    {
        var chr = e.which;

        if(chr === 8)
        {
            // supress backspace
            serial.send_char(127);
            e.preventDefault();
        }
        else if(chr === 9)
        {
            // tab
            serial.send_char(9);
            e.preventDefault();
        }
    }

    function paste_handler(e)
    {
        if(!may_handle(e))
        {
            return;
        }

        var data = e.clipboardData.getData("text/plain");

        for(var i = 0; i < data.length; i++)
        {
            serial.send_char(data.charCodeAt(i));
        }

        e.preventDefault();
    }

    function window_click_handler(e)
    {
        if(e.target !== element)
        {
            element.blur();
        }
    }
}

/**
 * @constructor
 *
 * @param {BusConnector} bus
 */
function SerialRecordingAdapter(bus)
{
    var serial = this;
    this.text = "";

    bus.register("serial0-output-byte", function(byte)
    {
        var chr = String.fromCharCode(byte);
        this.text += chr;
    }, this);
}

/**
 * @constructor
 * @param {BusConnector} bus
 */
function SerialAdapterXtermJS(element, bus)
{
    this.element = element;

    if(!window["Terminal"])
    {
        return;
    }

    var term = this.term = new window["Terminal"]({
        "logLevel": "off",
    });
    term.write("type any key to begin");
    term.clear()

    const on_data_disposable = term["onData"](function(data) {
        for(let i = 0; i < data.length; i++)
        {
            bus.send("serial0-input", data.charCodeAt(i));
        }
    });

    bus.register("serial0-output-byte", function(byte)
    {
        term.write(Uint8Array.of(byte));
    }, this);

    this.destroy = function() {
        on_data_disposable["dispose"]();
        term["dispose"]();
    };
}

SerialAdapterXtermJS.prototype.show = function()
{
    this.term && this.term.open(this.element);
};
