'use strict';

var expect = require('chai').expect;

var irc = require('../lib/irc');
var homura = require('../lib/homura');

describe('homura', function() {
    describe('end to end messaging', function() {
        it('should proxy IRC message between 1 client and 1 IRC server', function(done) {
            var ircServer = new irc.Server({ host : 'localhost', port : 16667 });
            ircServer.on('listening', function() {
                var hom = new homura.Homura({
                    host : 'localhost',
                    port : 16668,
                    bouncers : [{
                        name : 'testnetwork',
                        encoding : 'UTF-8',
                        host     : 'localhost',
                        port     : 16667,
                        nick     : 'testnick',
                        user     : 'testuser',
                        real     : 'testreal',
                    }],
                });
                hom.start();
                hom.server.on('listening', function() {
                    var homClient = new irc.Client({ 
                        encoding : 'UTF-8',
                        host     : 'localhost',
                        port     : 16668,
                        nick     : 'testnick',
                        user     : 'testuser@testnetwork',
                        real     : 'testreal',
                    });
                    homClient.on('register', function() {
                        homClient.send('PRIVMSG',  ['#test', 'hello. I am a client.']);
                        homClient.on('privmsg', function(message) {
                            expect(message).to.have.property('prefix', 'server');
                            expect(message).to.have.property('command', 'PRIVMSG');
                            expect(message).to.have.property('params').that.eql([ '#test', 'hello. I am a server.' ]);
                            done();
                        });
                    });
                    homClient.connect();
                });
            });
            ircServer.on('connect', function(session) {
                session.on('privmsg', function(message) {
                    expect(message).to.have.property('prefix').that.to.be.null;
                    expect(message).to.have.property('command', 'PRIVMSG');
                    expect(message).to.have.property('params').that.eql([ '#test', 'hello. I am a client.' ]);
                    session.send('server', 'PRIVMSG',  ['#test', 'hello. I am a server.']);
                });
            });
            ircServer.start();
        });
    });
});
